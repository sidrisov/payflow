package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.config.PayflowConfig;

@Slf4j
@Service
public class InvitationService {

	@Autowired
	private PayflowConfig payflowConfig;

	@Autowired
	private IdentityService identityService;

	public boolean isWhitelistedByIdentityFid(String identity) {
		Integer fid = identityService.getIdentityFid(identity);
		if (fid != null) {
			return fid <= payflowConfig.getWhitelistedFidUpperRange();
		}
		return false;
	}
}
