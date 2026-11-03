package dk.zak.booking;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dk.zak.booking.repository.BookingRepository;
import dk.zak.booking.repository.TreatmentRepository;
import java.time.*;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired BookingRepository bookings;
    @Autowired TreatmentRepository treatments;
    @Autowired ObjectMapper mapper;

    @BeforeEach
    void cleanBookings() {
        bookings.deleteAll();
    }

    private String futureSlot() {
        LocalDate date = LocalDate.now().plusDays(14);
        if (date.getDayOfWeek() == DayOfWeek.SUNDAY) date = date.plusDays(1);
        return date.atTime(10, 0).toString();
    }

    private long treatmentId() {
        return treatments.findAll().get(0).getId();
    }

    private String body(String name, long treatmentId, String time) throws Exception {
        return mapper.writeValueAsString(Map.of(
            "customerName", name, "customerEmail", "exam@example.dk",
            "treatmentId", treatmentId, "startTime", time));
    }

    private long createBooking(String time) throws Exception {
        String json = mvc.perform(post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON).content(body("Zak", treatmentId(), time)))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andReturn().getResponse().getContentAsString();
        return mapper.readTree(json).path("id").asLong();
    }

    @Test
    void treatmentsReturn200() throws Exception {
        mvc.perform(get("/api/treatments")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].durationMinutes").isNumber());
    }

    @Test
    void createAndFetchBookingReturn201And200() throws Exception {
        long id = createBooking(futureSlot());
        mvc.perform(get("/api/bookings/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.customerName").value("Zak"))
            .andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(get("/api/bookings")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(id));
    }

    @Test
    void blankNameReturns400AsJson() throws Exception {
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
            .content(body("", treatmentId(), futureSlot())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.message").value("Kundens navn må ikke være tomt"));
        assertEquals(0, bookings.count());
    }

    @Test
    void malformedJsonReturns400() throws Exception {
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
            .content("{not-json"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void unknownBookingAndTreatmentReturn404() throws Exception {
        mvc.perform(get("/api/bookings/999999")).andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404));
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
            .content(body("Zak", 999999, futureSlot())))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void duplicateBookingReturns409() throws Exception {
        String time = futureSlot();
        createBooking(time);
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
            .content(body("En anden kunde", treatmentId(), time)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value(409));
        assertEquals(1, bookings.count());
    }

    @Test
    void overlappingTreatmentsReturn409() throws Exception {
        long longTreatment = treatments.findAll().stream()
            .filter(t -> t.getDurationMinutes() >= 60).findFirst().orElseThrow().getId();
        String time = futureSlot();
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
            .content(body("Lang booking", longTreatment, time))).andExpect(status().isCreated());
        String overlap = LocalDateTime.parse(time).plusMinutes(30).toString();
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
            .content(body("Kort booking", treatmentId(), overlap))).andExpect(status().isConflict());
    }

    @Test
    void updateAndCancelReturn200And204() throws Exception {
        String time = futureSlot();
        long id = createBooking(time);
        String moved = LocalDateTime.parse(time).plusHours(2).toString();
        mvc.perform(put("/api/bookings/{id}", id).contentType(MediaType.APPLICATION_JSON)
            .content(body("Zak opdateret", treatmentId(), moved)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.startTime").value(moved));
        mvc.perform(delete("/api/bookings/{id}", id))
            .andExpect(status().isNoContent())
            .andExpect(content().string(""));
        mvc.perform(get("/api/bookings/{id}", id))
            .andExpect(jsonPath("$.status").value("CANCELLED"));
        mvc.perform(put("/api/bookings/{id}", id).contentType(MediaType.APPLICATION_JSON)
            .content(body("Zak", treatmentId(), time)))
            .andExpect(status().isConflict());
    }

    @Test
    void availabilityExcludesOccupiedSlot() throws Exception {
        String time = futureSlot();
        createBooking(time);
        mvc.perform(get("/api/availability")
                .param("treatmentId", String.valueOf(treatmentId()))
                .param("date", time.substring(0, 10)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[?(@ == '" + time + "')]").doesNotExist());
    }

    @Test
    void pastDateReturns400() throws Exception {
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
            .content(body("Zak", treatmentId(), "2020-01-01T10:00:00")))
            .andExpect(status().isBadRequest());
    }
}
