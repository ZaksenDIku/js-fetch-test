package dk.zak.booking;

import dk.zak.booking.dto.BookingRequest;
import dk.zak.booking.repository.BookingRepository;
import dk.zak.booking.repository.TreatmentRepository;
import dk.zak.booking.service.BookingService;
import java.nio.file.*;
import java.time.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import static org.junit.jupiter.api.Assertions.*;

class FilePersistenceTest {
    @TempDir Path temp;

    @Test
    void bookingSurvivesApplicationRestart() {
        Path database = temp.resolve("persistent-booking");
        String url = "jdbc:h2:file:" + database.toAbsolutePath() + ";DB_CLOSE_ON_EXIT=FALSE";
        Long savedId;
        String[] settings = { "--spring.datasource.url=" + url,
            "--spring.jpa.hibernate.ddl-auto=update", "--spring.main.web-application-type=none" };
        LocalDate date = LocalDate.now().plusDays(20);
        if (date.getDayOfWeek() == DayOfWeek.SUNDAY) date = date.plusDays(1);

        try (ConfigurableApplicationContext first = new SpringApplicationBuilder(BookingApplication.class)
            .web(WebApplicationType.NONE).run(settings)) {
            Long treatmentId = first.getBean(TreatmentRepository.class).findAll().get(0).getId();
            savedId = first.getBean(BookingService.class).create(
                new BookingRequest("Persistens", "persistens@example.dk", treatmentId, date.atTime(10, 0))).id();
            assertNotNull(savedId);
        }

        assertTrue(Files.exists(Path.of(database.toString() + ".mv.db")), "H2 should write a file");

        try (ConfigurableApplicationContext second = new SpringApplicationBuilder(BookingApplication.class)
            .web(WebApplicationType.NONE).run(settings)) {
            assertTrue(second.getBean(BookingRepository.class).findById(savedId).isPresent(),
                "Booking must be present after closing and reopening Spring Boot");
        }
    }
}
