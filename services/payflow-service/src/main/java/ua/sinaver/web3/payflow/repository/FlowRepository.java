package ua.sinaver.web3.payflow.repository;

import org.springframework.data.repository.CrudRepository;
import ua.sinaver.web3.payflow.data.Flow;

import java.util.List;

public interface FlowRepository extends CrudRepository<Flow, Integer> {
	List<Flow> findByUserId(Integer userId);

	Flow findByUuid(String uuid);
}
