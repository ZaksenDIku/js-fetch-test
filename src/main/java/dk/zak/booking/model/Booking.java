package dk.zak.booking.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "treatment_id", nullable = false)
    private Treatment treatment;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.ACTIVE;

    protected Booking() {}

    public Booking(Customer customer, Treatment treatment, LocalDateTime startTime) {
        this.customer = customer;
        this.treatment = treatment;
        this.startTime = startTime;
    }

    public Long getId() { return id; }
    public Customer getCustomer() { return customer; }
    public Treatment getTreatment() { return treatment; }
    public LocalDateTime getStartTime() { return startTime; }
    public BookingStatus getStatus() { return status; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public void setTreatment(Treatment treatment) { this.treatment = treatment; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public void setStatus(BookingStatus status) { this.status = status; }
}
