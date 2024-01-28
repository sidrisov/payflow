package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/farcaster/frames")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class FcFramesController {

	@PostMapping("/connect")
	public ResponseEntity<String> connect(@RequestBody String frameMessage) {
		log.debug("Received connect frame: {}", frameMessage);

		return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body("""
				<!DOCTYPE html>
				          <html>
				              <head>
				                  <meta property="fc:frame" content="vNext" />
				                     <meta property="fc:frame:image" content="https://drive.google.com/uc?id=12uZfK2BiPoVQOVJt1Kh2H9usgN29H_Dq"/>
				                     <meta property="fc:frame:button:1" content="Balance" />
				                     <meta property="fc:frame:button:2" content="Invite" />
				                     <meta property="fc:frame:post_url" content="https://api.stg.payflow.me/api/farcaster/frames/actions" />
				              </head>
				        </html>
				""");

	}

	@PostMapping("/actions")
	public ResponseEntity<String> actions(@RequestBody String frameMessage) {
		log.debug("Received action frame: {}", frameMessage);

		return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body("""
				<!DOCTYPE html>
				          <html>
				              <head>
				                  <meta property="fc:frame" content="vNext" />
				                     <meta property="fc:frame:image" content="https://drive.google.com/uc?id=12uZfK2BiPoVQOVJt1Kh2H9usgN29H_Dq"/>
				              </head>
				        </html>
				""");

	}
}
