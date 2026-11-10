package dk.zak.booking.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "treatments")
public class Treatment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private int durationMinutes;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    protected Treatment() {}

    public Treatment(String name, int durationMinutes, BigDecimal price) {
        this.name = name;
        this.durationMinutes = durationMinutes;
        this.price = price;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public int getDurationMinutes() { return durationMinutes; }
    public BigDecimal getPrice() { return price; }
}
