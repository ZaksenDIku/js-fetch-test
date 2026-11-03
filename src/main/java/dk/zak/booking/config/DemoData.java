package dk.zak.booking.config;

import dk.zak.booking.model.Treatment;
import dk.zak.booking.repository.TreatmentRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DemoData {
    @Bean
    CommandLineRunner seedTreatments(TreatmentRepository treatments) {
        return args -> {
            if (treatments.count() == 0) {
                treatments.saveAll(List.of(
                    new Treatment("Herreklip", 30, new BigDecimal("250.00")),
                    new Treatment("Dameklip", 60, new BigDecimal("400.00")),
                    new Treatment("Skægtrimning", 30, new BigDecimal("150.00")),
                    new Treatment("Klip og vask", 90, new BigDecimal("550.00"))
                ));
            }
        };
    }
}
