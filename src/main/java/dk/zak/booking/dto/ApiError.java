package dk.zak.booking.dto;

public record ApiError(int status, String error, String message) {}
