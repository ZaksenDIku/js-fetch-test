package dk.zak.booking.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public record BookingRequest(
    @NotBlank(message = "Kundens navn må ikke være tomt") String customerName,
    @NotBlank(message = "E-mail må ikke være tom") @Email(message = "E-mail er ugyldig") String customerEmail,
    @NotNull(message = "Behandling mangler") @Positive(message = "Behandlings-ID skal være positivt") Long treatmentId,
    @NotNull(message = "Tidspunkt mangler") LocalDateTime startTime
) {}
