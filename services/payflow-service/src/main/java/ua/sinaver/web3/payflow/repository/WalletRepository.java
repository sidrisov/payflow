package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ua.sinaver.web3.payflow.entity.Wallet;

public interface WalletRepository extends JpaRepository<Wallet, Integer> {
}
