package dk.zak.booking.web;

import dk.zak.booking.dto.TreatmentResponse;
import dk.zak.booking.repository.TreatmentRepository;
import dk.zak.booking.service.BookingService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController
public class TreatmentController {
    private final TreatmentRepository treatments;
    private final BookingService bookings;

    public TreatmentController(TreatmentRepository treatments, BookingService bookings) {
        this.treatments = treatments;
        this.bookings = bookings;
    }

    @GetMapping("/api/treatments")
    public List<TreatmentResponse> list() {
        return treatments.findAll().stream()
            .map(t -> new TreatmentResponse(t.getId(), t.getName(), t.getDurationMinutes(), t.getPrice()))
            .toList();
    }

    @GetMapping("/api/availability")
    public List<String> availability(@RequestParam Long treatmentId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return bookings.availableSlots(treatmentId, date);
    }
}
