package ua.sinaver.web3.payflow.anthropic.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.web.reactive.function.client.WebClient;
import ua.sinaver.web3.payflow.message.agent.AgentMessage;
import ua.sinaver.web3.payflow.message.farcaster.CastConversationData;
import ua.sinaver.web3.payflow.service.AnthropicAgentService;
import ua.sinaver.web3.payflow.service.TokenService;

import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@Slf4j
@SpringJUnitConfig(classes = { AnthropicAgentService.class, TokenService.class, AnthropicApiTest.TestConfig.class })
@TestPropertySource(locations = "classpath:application.properties")
public class AnthropicApiTest {

	@Value("${anthropic.api.key}")
	private String anthropicApiKey;
	@Autowired
	private AnthropicAgentService anthropicAgentService;

	@Value("classpath:long_conversation.json")
	private Resource longConversationResource;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	public void testSimplePayment() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "sinaver.eth",
						"displayName": "Sinaver"
					  },
					  "text": "@payflow send some degen to @glodollar",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "glodollar",
						  "displayName": "GloDollar"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());

		var toolUseContent = response.getContent().stream()
				.filter(c -> c.getType().equals("tool_use"))
				.findFirst()
				.orElse(null);
		assertNotNull(toolUseContent);
		assertEquals("send_payments", toolUseContent.getName());
	}

	@Test
	public void testSimpleReplyPayment() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "sinaver.eth",
						"displayName": "Sinaver"
					  },
					  "text": "@payflow send some degen",
					  "directReplies": []
					},
					"chronologicalParentCasts": [
						{
						"author": {
							"fid": 2,
							"username": "glodollar",
							"displayName": "GloDollar"
						},
						"text": "Hey hey"
						}
					]
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());

		var toolUseContent = response.getContent().stream()
				.filter(c -> c.getType().equals("tool_use"))
				.findFirst()
				.orElse(null);
		assertNotNull(toolUseContent);
		assertEquals("send_payments", toolUseContent.getName());
	}

	@Test
	public void testDegenL3Payment() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "sinaver.eth",
						"displayName": "Sinaver"
					  },
					  "text": "@payflow can you send @alice some degen on l3?",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "alice",
						  "displayName": "Alice"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testSimplePaymentByTokenAddress() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
						"text": "send 5 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 to @alice",
						"mentionedProfiles": [
							{
								"fid": 2,
								"username": "alice",
								"displayName": "Alice"
							}
						],
						"directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
		var toolUseContent = response.getContent().stream()
				.filter(c -> c.getType().equals("tool_use"))
				.findFirst()
				.orElse(null);
		assertNotNull(toolUseContent);
		assertEquals("send_payments", toolUseContent.getName());
	}

	@Test
	public void testWhoAreYou() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
					  "text": "@payflow agent introduce yourself first? different between App and Agent? what's my balance? how to top up? and send 1 usdglo to @alice",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "alice",
						  "displayName": "Alice"
						},
						{
						  "fid": 3,
						  "username": "payflow",
						  "displayName": "Payflow"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertNotNull(response.getContent());
		assertEquals("tool_use", response.getStopReason());
	}

	@Test
	public void testSendAnyToken() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
					  "text": "send any token to any user",
					  "mentionedProfiles": [],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("end_turn", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testBuyStorage() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "sinaver.eth",
						"displayName": "Sinaver"
					  },
					  "text": "buy storage for @alice",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "alice",
						  "displayName": "Alice"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());

		var toolUseContent = response.getContent().stream()
				.filter(c -> c.getType().equals("tool_use"))
				.findFirst()
				.orElse(null);

		assertNotNull(toolUseContent);
		assertEquals("buy_storage", toolUseContent.getName());

		val input = (Map<String, Object>) toolUseContent.getInput();
		val fid = ((Integer) input.get("fid"));
		assertEquals(2, fid);
	}

	@Test
	public void testPayMe() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "alice.eth",
						"displayName": "Alice"
					  },
					  "text": "@payflow @bob pay me 5 usdglo",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "bob",
						  "displayName": "Bob"
						},
						{
						  "fid": 3,
						  "username": "payflow",
						  "displayName": "Payflow"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testClaimDegenOrMoxie() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
					  "text": "@payflow can you help me claim degen?",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "payflow",
						  "displayName": "Payflow"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testBridgingSupported() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
					  "text": "@payflow can you bridge L3 $degen to L2?",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "payflow",
						  "displayName": "Payflow"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("end_turn", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Test
	public void testAppreciationAndDegenPayment() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 2,
						"username": "sinaver.eth",
						"displayName": "Sinaver"
					  },
						"text": "@payflow let's also send 100 degen",
						"mentionedProfiles": [
							{
								"fid": 3,
								"username": "payflow",
								"displayName": "Payflow"
							}
						],
						"directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());

		var toolUseContent = response.getContent().stream()
				.filter(c -> c.getType().equals("tool_use"))
				.findFirst()
				.orElse(null);
		assertNotNull(toolUseContent);
	}

	@Test
	public void testMultiTokenPayment() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
					  "text": "@payflow send 10 degen to @jacek, and 10 degen on degen l3 to @accountless.eth, and also 10 tn100x on Ham to @deployer",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "jacek",
						  "displayName": "Jacek"
						},
						{
						  "fid": 3,
						  "username": "accountless.eth",
						  "displayName": "Accountless"
						},
						{
						  "fid": 4,
						  "username": "deployer",
						  "displayName": "Deployer"
						},
						{
						  "fid": 5,
						  "username": "payflow",
						  "displayName": "Payflow"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());

		// Verify the content includes processing multiple payments
		var toolUseContent = response.getContent().stream()
				.filter(c -> c.getType().equals("tool_use"))
				.findFirst()
				.orElse(null);
		assertNotNull(toolUseContent);
		assertEquals("send_payments", toolUseContent.getName());

		var input = (Map<String, Object>) toolUseContent.getInput();
		var recipients = (List<Map<String, Object>>) input.get("recipients");
		assertNotNull(recipients);
		assertEquals(3, recipients.size());

		// Verify first recipient (Jacek - Degen on default chain)
		assertEquals("jacek", recipients.get(0).get("username"));
		assertEquals(10, recipients.get(0).get("amount"));
		assertEquals("degen", recipients.get(0).get("token"));

		// Verify second recipient (accountless.eth - Degen on L3)
		assertEquals("accountless.eth", recipients.get(1).get("username"));
		assertEquals(10, recipients.get(1).get("amount"));
		assertEquals("degen", recipients.get(1).get("token"));
		assertEquals(666666666, recipients.get(1).get("chainId"));

		// Verify third recipient (deployer - TN100X on Ham)
		assertEquals("deployer", recipients.get(2).get("username"));
		assertEquals(10, recipients.get(2).get("amount"));
		assertEquals("tn100x", recipients.get(2).get("token"));
		assertEquals(5112, recipients.get(2).get("chainId"));
	}

	@Test
	public void testNoReplyForMintingInfo() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "heyake",
						"displayName": "Heyake"
					  },
					  "text": "I just minted @dante20's Chromatic souls: Rodeo posts #92 on @rodeodotclub\\n\\n@payflow cast action lets you mint or gift collectibles with 30+ tokens cross-chain! cc: @sinaver",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "dante20",
						  "displayName": "Dante"
						},
						{
						  "fid": 3,
						  "username": "rodeodotclub",
						  "displayName": "Rodeo"
						},
						{
						  "fid": 4,
						  "username": "sinaver",
						  "displayName": "Sinaver"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());

		// Verify no_reply tool was used
		val noReplyContent = response.getContent().stream()
				.filter(content -> "tool_use".equals(content.getType()) &&
						"no_reply".equals(content.getName()))
				.findFirst()
				.orElse(null);

		assertNotNull(noReplyContent, "Expected no_reply tool to be used");
		val reason = (String) noReplyContent.getInput().get("reason");
		assertNotNull(reason);
	}

	@Test
	public void testNoReplyForRaffleAnnouncement() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "bizarrebeast",
						"displayName": "BizarreBeasts"
					  },
					  "text": "🎉 BizarreBeasts x dGEN1 Raffle! 🎉\\n\\nEnter the BizarreBeasts x dGEN1 Raffle for a chance to win:\\n1) OG Edition dGEN1 pre-order NFT (.1419 ETH)\\n2) BizarreBeasts Custom PFP 2-pack (.1 ETH)\\n\\nHow to Enter:\\n1) Follow @bizarrebeast and /bizarrebeasts\\n2) Join the raffle for 100 DEGEN per entry using one of the following methods:\\n- tip 100 DEGEN per entry in the comments\\n- use my @payflow frame to send 100 DEGEN per entry (check comments below)",
					  "mentionedProfiles": [
						{
						  "fid": 2,
						  "username": "payflow",
						  "displayName": "Payflow"
						}
					  ],
					  "directReplies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());

		// Verify no_reply tool was used
		val noReplyContent = response.getContent().stream()
				.filter(content -> "tool_use".equals(content.getType()) &&
						"no_reply".equals(content.getName()))
				.findFirst()
				.orElse(null);

		assertNotNull(noReplyContent, "Expected no_reply tool to be used");

	}

	@Test
	public void testDeadLoopConversationBetweenAgents() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
				    "cast": {
				      "author": {
				        "fid": 382802,
				        "username": "askgina.eth",
				        "displayName": "Gina"
				      },
				      "text": "Hey I'm Gina, your onchain AI assistant!\\n\\nTo get access to me, sign in with Farcaster at https://askgina.ai\\n\\nLook forward to chatting with you soon!\\n",
				      "directReplies": [
				        {
				          "author": {
				            "fid": 211734,
				            "username": "payflow",
				            "displayName": "Payflow"
				          },
				          "text": "Based on the conversation, I'll help @askgina.eth purchase Farcaster storage since a Payflow notification about storage capacity was sent.",
				          "frames": [
				            {
				              "version": "vNext",
				              "title": "Payflow | Frames",
				              "buttons": [
				                {
				                  "index": 1,
				                  "title": "Buy",
				                  "actionType": "postRedirect",
				                  "target": "https://api.alpha.payflow.me/api/farcaster/frames/storage/382802/submit"
				                },
				                {
				                  "index": 2,
				                  "title": "My usage",
				                  "actionType": "post",
				                  "target": "https://api.alpha.payflow.me/api/farcaster/frames/storage/check"
				                }
				              ]
				            }
				          ]
				        }
				      ]
				    },
				    "chronologicalParentCasts": [
				      {
				        "author": {
				          "fid": 19129,
				          "username": "sinaver.eth",
				          "displayName": "Sinaver"
				        },
				        "text": "Original conversation starter"
				      },
				      {
				        "author": {
				          "fid": 382802,
				          "username": "askgina.eth",
				          "displayName": "Gina"
				        },
				        "text": "Hey I'm Gina, your onchain AI assistant!\\n\\nTo get access to me, sign in with Farcaster at https://askgina.ai\\n\\nLook forward to chatting with you soon!\\n"
				      },
				      {
				        "author": {
				          "fid": 211734,
				          "username": "payflow",
				          "displayName": "Payflow"
				        },
				        "text": "I'll help @askgina.eth purchase Farcaster storage since a Payflow notification about storage capacity was sent."
				      },
					  {
				        "author": {
				          "fid": 382802,
				          "username": "askgina.eth",
				          "displayName": "Gina"
				        },
				        "text": "Hey I'm Gina, your onchain AI assistant!\\n\\nTo get access to me, sign in with Farcaster at https://askgina.ai\\n\\nLook forward to chatting with you soon!\\n"
				      },
				      {
				        "author": {
				          "fid": 211734,
				          "username": "payflow",
				          "displayName": "Payflow"
				        },
				        "text": "I'll help @askgina.eth purchase Farcaster storage since a Payflow notification about storage capacity was sent."
				      },
					  {
				        "author": {
				          "fid": 382802,
				          "username": "askgina.eth",
				          "displayName": "Gina"
				        },
				        "text": "Hey I'm Gina, your onchain AI assistant!\\n\\nTo get access to me, sign in with Farcaster at https://askgina.ai\\n\\nLook forward to chatting with you soon!\\n"
				      },
				      {
				        "author": {
				          "fid": 211734,
				          "username": "payflow",
				          "displayName": "Payflow"
				        },
				        "text": "I'll help @askgina.eth purchase Farcaster storage since a Payflow notification about storage capacity was sent."
				      },
					  {
				        "author": {
				          "fid": 382802,
				          "username": "askgina.eth",
				          "displayName": "Gina"
				        },
				        "text": "Hey I'm Gina, your onchain AI assistant!\\n\\nTo get access to me, sign in with Farcaster at https://askgina.ai\\n\\nLook forward to chatting with you soon!\\n"
				      },
				      {
				        "author": {
				          "fid": 211734,
				          "username": "payflow",
				          "displayName": "Payflow"
				        },
				        "text": "I'll help @askgina.eth purchase Farcaster storage since a Payflow notification about storage capacity was sent."
				      }
				    ]
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(
								AgentMessage.Content.builder()
										.type("text")
										.text("Conversation in JSON:\n" + conversationJson)
										.build()))
						.build()));

		assertNotNull(response);
		assertEquals("tool_use", response.getStopReason());
		assertNotNull(response.getContent());

		// Verify no_reply tool was used
		val noReplyContent = response.getContent().stream()
				.filter(content -> "tool_use".equals(content.getType()) &&
						"no_reply".equals(content.getName()))
				.findFirst()
				.orElse(null);

		assertNotNull(noReplyContent, "Expected no_reply tool to be used");
	}

	@Test
	public void testReallyLongConversation() throws JsonProcessingException {
		try (InputStreamReader reader = new InputStreamReader(longConversationResource.getInputStream())) {
			var conversationData = objectMapper.readValue(reader, CastConversationData.class);

			// Limit chronological parent casts to last 100
			if (conversationData.conversation().chronologicalParentCasts().size() > 100) {
				var limitedParents = conversationData.conversation().chronologicalParentCasts()
						.subList(Math.max(0, conversationData.conversation().chronologicalParentCasts().size() - 100),
								conversationData.conversation().chronologicalParentCasts().size());
				conversationData = new CastConversationData(
						new CastConversationData.Conversation(
								conversationData.conversation().cast(),
								limitedParents));
			}

			String conversationJson = objectMapper.writeValueAsString(conversationData);

			val response = anthropicAgentService.processPaymentInput(
					List.of(AgentMessage.builder()
							.role("user")
							.content(List.of(
									AgentMessage.Content.builder()
											.type("text")
											.text("Conversation in JSON:\n" + conversationJson)
											.build()))
							.build()));

			assertNotNull(response);
			assertNotNull(response.getContent());
			assertEquals("tool_use", response.getStopReason());
		} catch (IOException e) {
			throw new RuntimeException("Failed to read conversation JSON", e);
		}
	}

	@Test
	public void testHowToSupportPayflow() throws JsonProcessingException {
		String conversationJson = """
				{
				  "conversation": {
					"cast": {
					  "author": {
						"fid": 1,
						"username": "user.eth",
						"displayName": "User"
					  },
					  "text": "how can I support Payflow? is there any subscription?",
					  "directRe	plies": []
					},
					"chronologicalParentCasts": []
				  }
				}
				""";

		val response = anthropicAgentService.processPaymentInput(
				List.of(AgentMessage.builder()
						.role("user")
						.content(List.of(AgentMessage.Content.builder()
								.type("text")
								.text("Conversation in JSON:\n" + conversationJson)
								.build()))
						.build()));

		assertNotNull(response);
		assertEquals("end_turn", response.getStopReason());
		assertNotNull(response.getContent());
	}

	@Configuration
	static class TestConfig {

		@Bean
		public ObjectMapper objectMapper() {
			return JsonMapper.builder()
					.serializationInclusion(JsonInclude.Include.NON_NULL)
					.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
					.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_ENUMS, true)
					.build();
		}

		@Bean
		public WebClient.Builder webClientBuilder(ObjectMapper objectMapper) {
			return WebClient.builder()
					.codecs(configurer -> configurer.defaultCodecs()
							.jackson2JsonEncoder(new Jackson2JsonEncoder(objectMapper)));
		}

	}
}
