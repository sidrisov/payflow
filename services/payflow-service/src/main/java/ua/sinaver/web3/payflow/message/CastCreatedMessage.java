package ua.sinaver.web3.payflow.message;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Date;

public record CastCreatedMessage(@JsonProperty("created_at") Date createdAt, String type,
                                 CastMessage data) {
}