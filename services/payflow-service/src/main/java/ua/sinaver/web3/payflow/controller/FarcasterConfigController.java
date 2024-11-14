package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.StorageNotification;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.repository.StorageNotificationRepository;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.UserService;

import java.security.Principal;

@RestController
@RequestMapping("/farcaster/config")
@Slf4j
@Transactional
@CrossOrigin(origins = {"${payflow.dapp.url}"}, allowCredentials = "true")
public class FarcasterConfigController {
	@Autowired
	private UserService userService;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private StorageNotificationRepository storageNotificationRepository;

	@PutMapping("/client")
	@ResponseStatus(HttpStatus.OK)
	public void updatePreferred(Principal principal,
	                            @RequestBody User.FarcasterClient farcasterClient) {
		if (principal == null) {
			throw new BadCredentialsException("No authentication provided!");
		}

		log.debug("{} updating preferred farcaster client: {}", principal.getName(),
				farcasterClient);
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new UsernameNotFoundException("User not found!");
		}
		user.setPreferredFarcasterClient(farcasterClient);
		userService.saveUser(user);
	}

	@GetMapping("/storage/notification")
	public ResponseEntity<StorageNotification> getStorageNotification(Principal principal) {
		if (principal == null) {
			throw new BadCredentialsException("No authentication provided!");
		}

		log.debug("Fetching storage notification settings for {}", principal.getName());

		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			return ResponseEntity.notFound().build();
		}

		val fid = identityService.getIdentityFid(user.getIdentity());
		if (fid == null) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(storageNotificationRepository.findByFid(Integer.parseInt(fid)).orElse(new StorageNotification(Integer.parseInt(fid))));
	}

	@PutMapping("/storage/notification")
	public ResponseEntity<StorageNotification> updateStorageNotification(
			Principal principal,
			@RequestBody StorageNotification settings) {
		if (principal == null) {
			throw new BadCredentialsException("No authentication provided!");
		}

		log.debug("Updating storage notification settings for {}: {}", principal.getName(), settings);

		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			return ResponseEntity.notFound().build();
		}

		val fid = identityService.getIdentityFid(user.getIdentity());
		if (fid == null) {
			return ResponseEntity.notFound().build();
		}

		val notification = storageNotificationRepository.findByFid(Integer.parseInt(fid))
				.orElseGet(() -> new StorageNotification(Integer.parseInt(fid)));

		notification.setEnabled(settings.isEnabled());
		notification.setThreshold(settings.getThreshold());
		notification.setCapacityType(settings.getCapacityType());
		notification.setLastCheckedAt(null);

		return ResponseEntity.ok(storageNotificationRepository.save(notification));
	}
}
