package ua.sinaver.web3.payflow.repository;

import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.Flow;

public interface FlowRepository extends CrudRepository<Flow, Integer> {
	Flow findByUuid(String uuid);
}
