package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ua.sinaver.web3.payflow.entity.Wallet;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Integer> {
}
