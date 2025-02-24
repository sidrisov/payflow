package ua.sinaver.web3.payflow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ua.sinaver.web3.payflow.entity.Jar;

import org.springframework.stereotype.Repository;

@Repository
public interface JarRepository extends JpaRepository<Jar, Integer> {
	@Query("SELECT j FROM Jar j WHERE j.flow.uuid = :uuid")
	Jar findByFlowUuid(String uuid);
}
