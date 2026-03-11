package com.amanah.repository;

import com.amanah.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findAllByChildIdOrderByDateDesc(UUID childId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.childId = :childId")
    BigDecimal sumByChildId(UUID childId);

    @Modifying
    @Transactional
    void deleteAllByChildId(UUID childId);
}
