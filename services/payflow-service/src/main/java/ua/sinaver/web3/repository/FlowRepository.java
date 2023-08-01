package ua.sinaver.web3.repository;

import ua.sinaver.web3.data.Flow;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

public interface FlowRepository extends CrudRepository<Flow, Integer> {
    List<Flow> findByUserId(Integer userId);

    Flow findByUuid(String uuid);
}
