package dk.zak.booking.repository;

import dk.zak.booking.model.Booking;
import dk.zak.booking.model.BookingStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findAllByOrderByStartTimeAsc();
    List<Booking> findByStatusAndStartTimeBefore(BookingStatus status, LocalDateTime before);
}
