package ua.sinaver.web3.payflow.mapper;

import lombok.val;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ua.sinaver.web3.payflow.dto.WalletSessionMessage;
import ua.sinaver.web3.payflow.entity.WalletSession;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static ua.sinaver.web3.payflow.entity.WalletSession.EXPIRES_AFTER_HOURS;

@Mapper(componentModel = "spring")
public interface WalletSessionMapper {
	WalletSessionMessage toDto(WalletSession session);

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "version", ignore = true)
	@Mapping(target = "wallet", ignore = true)
	WalletSession toEntity(WalletSessionMessage message);

	@AfterMapping
	default void setDefaultTimestamps(@MappingTarget WalletSession session) {
		val now = Instant.now();
		if (session.getCreatedAt() == null) {
			session.setCreatedAt(now);
		}
		if (session.getExpiresAt() == null) {
			session.setExpiresAt(now.plus(EXPIRES_AFTER_HOURS, ChronoUnit.HOURS));
		}
	}
}
