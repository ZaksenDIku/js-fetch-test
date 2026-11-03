package dk.zak.booking.dto;

import dk.zak.booking.model.BookingStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingResponse(
    Long id,
    Long customerId,
    String customerName,
    String customerEmail,
    Long treatmentId,
    String treatmentName,
    int durationMinutes,
    BigDecimal price,
    LocalDateTime startTime,
    BookingStatus status
) {}
