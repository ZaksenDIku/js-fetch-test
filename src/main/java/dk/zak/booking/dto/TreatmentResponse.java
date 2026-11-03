package dk.zak.booking.dto;

import java.math.BigDecimal;

public record TreatmentResponse(Long id, String name, int durationMinutes, BigDecimal price) {}
