package ua.sinaver.web3.payflow.repository;

import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.entity.Flow;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface FlowRepository extends CrudRepository<Flow, Integer> {
	Flow findByUuid(String uuid);

	@Query("""
			    SELECT DISTINCT f FROM Flow f
			    JOIN f.wallets w
			    WHERE f.userId = :userId
			    AND w.walletVersion = :version
				AND w.network = 8453
			    AND f.disabled = false
			    AND w.disabled = false
			    AND (f.type = 'REGULAR' OR f.type is NULL)
			    ORDER BY f.createdDate DESC
				LIMIT 1
			""")
	Optional<Flow> findPayflowBalanceV2ByUserId(
			Integer userId,
			String version);
}
