package dk.zak.booking.service;

import dk.zak.booking.dto.*;
import dk.zak.booking.model.*;
import dk.zak.booking.repository.*;
import java.time.*;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
    private final BookingRepository bookings;
    private final CustomerRepository customers;
    private final TreatmentRepository treatments;

    public BookingService(BookingRepository bookings, CustomerRepository customers, TreatmentRepository treatments) {
        this.bookings = bookings;
        this.customers = customers;
        this.treatments = treatments;
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> list() {
        return bookings.findAllByOrderByStartTimeAsc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse get(Long id) {
        return toResponse(findBooking(id));
    }

    @Transactional
    public synchronized BookingResponse create(BookingRequest request) {
        Treatment treatment = findTreatment(request.treatmentId());
        checkSlot(request.startTime(), treatment, null);
        Customer customer = saveCustomer(request);
        Booking booking = new Booking(customer, treatment, request.startTime());
        return toResponse(bookings.save(booking));
    }

    @Transactional
    public synchronized BookingResponse update(Long id, BookingRequest request) {
        Booking booking = findBooking(id);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ApiException(HttpStatus.CONFLICT, "En aflyst booking kan ikke redigeres");
        }
        Treatment treatment = findTreatment(request.treatmentId());
        checkSlot(request.startTime(), treatment, id);
        booking.setCustomer(saveCustomer(request));
        booking.setTreatment(treatment);
        booking.setStartTime(request.startTime());
        return toResponse(bookings.save(booking));
    }

    @Transactional
    public synchronized void cancel(Long id) {
        Booking booking = findBooking(id);
        booking.setStatus(BookingStatus.CANCELLED);
        bookings.save(booking);
    }

    @Transactional(readOnly = true)
    public List<String> availableSlots(Long treatmentId, LocalDate date) {
        if (date == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Dato mangler");
        Treatment treatment = findTreatment(treatmentId);
        List<String> slots = new ArrayList<>();
        LocalDateTime time = date.atTime(9, 0);
        LocalDateTime close = date.atTime(17, 0);
        while (!time.plusMinutes(treatment.getDurationMinutes()).isAfter(close)) {
            if (isSlotAvailable(time, treatment, null)) slots.add(time.toString());
            time = time.plusMinutes(30);
        }
        return slots;
    }

    private Customer saveCustomer(BookingRequest request) {
        String email = request.customerEmail().trim().toLowerCase();
        Customer customer = customers.findByEmailIgnoreCase(email)
            .orElseGet(() -> new Customer(request.customerName().trim(), email));
        customer.setName(request.customerName().trim());
        return customers.save(customer);
    }

    private void checkSlot(LocalDateTime start, Treatment treatment, Long excludedId) {
        if (start == null || start.isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tidspunktet skal ligge i fremtiden");
        }
        if (start.getSecond() != 0 || start.getNano() != 0 || start.getMinute() % 30 != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vælg en tid på hel eller halv time");
        }
        if (start.getDayOfWeek() == DayOfWeek.SUNDAY || start.toLocalTime().isBefore(LocalTime.of(9, 0))
            || start.plusMinutes(treatment.getDurationMinutes()).toLocalTime().isAfter(LocalTime.of(17, 0))
            || !start.plusMinutes(treatment.getDurationMinutes()).toLocalDate().equals(start.toLocalDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Salonen er åben mandag-lørdag kl. 09-17");
        }
        if (!isSlotAvailable(start, treatment, excludedId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Tidspunktet er allerede booket. Vælg en anden tid");
        }
    }

    private boolean isSlotAvailable(LocalDateTime start, Treatment treatment, Long excludedId) {
        if (start.isBefore(LocalDateTime.now()) || start.getDayOfWeek() == DayOfWeek.SUNDAY) return false;
        LocalDateTime end = start.plusMinutes(treatment.getDurationMinutes());
        for (Booking existing : bookings.findByStatusAndStartTimeBefore(BookingStatus.ACTIVE, end)) {
            if (excludedId != null && excludedId.equals(existing.getId())) continue;
            LocalDateTime existingEnd = existing.getStartTime().plusMinutes(existing.getTreatment().getDurationMinutes());
            if (existingEnd.isAfter(start)) return false;
        }
        return true;
    }

    private Booking findBooking(Long id) {
        return bookings.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking " + id + " blev ikke fundet"));
    }

    private Treatment findTreatment(Long id) {
        return treatments.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Behandling " + id + " blev ikke fundet"));
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(booking.getId(), booking.getCustomer().getId(),
            booking.getCustomer().getName(), booking.getCustomer().getEmail(),
            booking.getTreatment().getId(), booking.getTreatment().getName(),
            booking.getTreatment().getDurationMinutes(), booking.getTreatment().getPrice(),
            booking.getStartTime(), booking.getStatus());
    }
}
