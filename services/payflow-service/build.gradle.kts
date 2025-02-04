import com.netflix.graphql.dgs.codegen.gradle.GenerateJavaTask
import org.springframework.boot.buildpack.platform.build.PullPolicy
import org.springframework.boot.gradle.tasks.bundling.BootBuildImage
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    application
    id("org.springframework.boot") version "3.3.6"
    id("io.spring.dependency-management") version "1.1.4"
    id("com.google.cloud.artifactregistry.gradle-plugin") version "2.2.1"
    id("io.freefair.lombok") version "8.4"
    id("com.netflix.dgs.codegen") version "7.0.3"
}

application {
    mainClass.set("ua.sinaver.web3.payflow.Application")
}

group = "ua.sinaver.web3.payflow"
version = "0.1.0"

java.sourceCompatibility = JavaVersion.VERSION_21

repositories {
    mavenCentral()
}

extra["springCloudVersion"] = "2024.0.0"
extra["flywayVersion"] = "11.2.0"
extra["springCloudGcpVersion"] = "5.10.0"
extra["hypersistenceVersion"] = "3.9.0"
extra["jjwtVersion"] = "0.12.6"
extra["mysqlConnectorVersion"] = "9.2.0"
extra["commonsLangVersion"] = "3.17.0"
extra["guavaVersion"] = "33.4.0-jre"
extra["gsonVersion"] = "2.11.0"
extra["reactorCoreVersion"] = "3.7.2"
extra["nettyResolverVersion"] = "4.1.117.Final"
extra["bouncyCastleVersion"] = "1.80"
extra["web3jVersion"] = "4.12.3"
extra["siweVersion"] = "1.0.7"
extra["lombokVersion"] = "1.18.36"
extra["shedlockVersion"] = "6.2.0"
extra["mapstructVersion"] = "1.6.3"

dependencies {
    developmentOnly("org.springframework.boot:spring-boot-devtools")


    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-graphql")
    implementation("org.springframework.session:spring-session-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-aop")
    implementation("org.springframework.cloud:spring-cloud-starter-openfeign")

    implementation("io.hypersistence:hypersistence-utils-hibernate-63:${property("hypersistenceVersion")}")
    implementation("io.jsonwebtoken:jjwt:${property("jjwtVersion")}")

    if (project.hasProperty("gcp")) {
        project.logger.info("Including GCP dependencies")
        // gcp
        implementation("com.google.cloud:spring-cloud-gcp-starter")
        implementation("com.google.cloud:spring-cloud-gcp-starter-sql-mysql")
        implementation("com.google.cloud:google-cloud-redis")
        implementation("com.google.cloud:spring-cloud-gcp-logging:5.10.0")
    } else {
        // local
        //runtimeOnly ("com.h2database:h2")
        runtimeOnly("com.mysql:mysql-connector-j:${property("mysqlConnectorVersion")}")
    }

    // caching
    implementation("com.github.ben-manes.caffeine:caffeine")
    implementation("org.springframework.boot:spring-boot-starter-json")

    // redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // retry
    implementation("org.springframework.retry:spring-retry")

    // db migration
    implementation("org.flywaydb:flyway-core:${property("flywayVersion")}")
    implementation("org.flywaydb:flyway-mysql:${property("flywayVersion")}")

    // utils
    implementation("org.apache.commons:commons-lang3:${property("commonsLangVersion")}")
    implementation("com.google.guava:guava:${property("guavaVersion")}")
    implementation("com.google.code.gson:gson:${property("gsonVersion")}")

    implementation("com.github.victools:jsonschema-generator:4.34.0")

    // java.lang.NoSuchMethodError: 'reactor.core.publisher.Mono reactor.core.publisher.Mono.onErrorComplete()'
    implementation("io.projectreactor:reactor-core:${property("reactorCoreVersion")}")

    runtimeOnly("io.netty:netty-resolver-dns-native-macos:${property("nettyResolverVersion")}:osx-aarch_64")

    // crypto
    implementation("org.bouncycastle:bcprov-jdk18on:${property("bouncyCastleVersion")}")
    implementation("org.web3j:core:${property("web3jVersion")}")
    implementation("org.web3j:contracts:${property("web3jVersion")}")
    //siwe
    implementation("com.moonstoneid:siwe-java:${property("siweVersion")}")

    //lombok
    compileOnly("org.projectlombok:lombok:${property("lombokVersion")}")

    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // Add these lines
    implementation("net.javacrumbs.shedlock:shedlock-spring:${property("shedlockVersion")}")
    implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc-template:${property("shedlockVersion")}")

    // Add Anthropic SDK
    //implementation("com.anthropic:anthropic-java-core:0.1.0-alpha.6")

    // MapStruct
    implementation("org.mapstruct:mapstruct:${property("mapstructVersion")}")
    annotationProcessor("org.mapstruct:mapstruct-processor:${property("mapstructVersion")}")

    // If you're using Lombok, you need this additional processor to make Lombok work with MapStruct
    annotationProcessor("org.projectlombok:lombok-mapstruct-binding:0.2.0")


    // Add test dependencies if not already present
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.junit.jupiter:junit-jupiter-api")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine")

    configurations.all {
        exclude(group = "org.slf4j", module = "slf4j-simple")
    }
}


dependencyManagement {
    imports {
        mavenBom("com.netflix.graphql.dgs:graphql-dgs-platform-dependencies:latest.release")

        mavenBom("org.springframework.cloud:spring-cloud-dependencies:${property("springCloudVersion")}")

        if (project.hasProperty("gcp")) {
            // gcp
            mavenBom("com.google.cloud:spring-cloud-gcp-dependencies:${property("springCloudGcpVersion")}")
        }
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.withType<GenerateJavaTask>().configureEach {
    enabled = false
}

// Task for generating code from airstack.graphqls
tasks.register<GenerateJavaTask>("generateAirstackJava") {
    enabled = true
    description = "Generates Java classes from airstack.graphqls"

    // Specify the schema file for this task
    schemaPaths[0] = "${projectDir}/src/main/resources/schema/airstack.graphqls"

    // Specify the output package
    packageName = "ua.sinaver.web3.payflow.graphql.generated"

    generateClientv2 = true
    generateCustomAnnotations = true

    // Specify type mappings
    typeMapping["Address"] = "java.lang.String"
    typeMapping["Identity"] = "java.lang.String"
    typeMapping["Map"] = "java.util.Map"
    typeMapping["Time"] = "java.util.Date"
    typeMapping["Any"] = "java.lang.String"
    typeMapping["Bytes"] = "com.google.common.primitives.Bytes"
    typeMapping["BigInt"] = "java.math.BigInteger"
    typeMapping["BigDecimal"] = "java.math.BigDecimal"
}

// Task for generating code from moxie.graphqls
tasks.register<GenerateJavaTask>("generateMoxieStatsJava") {
    enabled = true
    description = "Generates Java classes from moxie.graphqls"

    // Specify the schema file for this task
    schemaPaths = mutableListOf(
        "${projectDir}/src/main/resources/schema/moxie_protocol_stats.graphqls",
    )

    // Specify the output package
    packageName = "ua.sinaver.web3.payflow.graphql.generated.moxie.stats"

    generateClientv2 = true
    snakeCaseConstantNames = false

    // Specify type mappings
    typeMapping["Address"] = "java.lang.String"
    typeMapping["Identity"] = "java.lang.String"
    typeMapping["Map"] = "java.util.Map"
    typeMapping["Time"] = "java.util.Date"
    typeMapping["Any"] = "java.lang.String"
    typeMapping["Bytes"] = "com.google.common.primitives.Bytes"
    typeMapping["BigInt"] = "java.math.BigInteger"
    typeMapping["BigDecimal"] = "java.math.BigDecimal"
}

tasks.register<GenerateJavaTask>("generateMoxieVestingJava") {
    enabled = true
    description = "Generates Java classes from moxie.graphqls"

    // Specify the schema file for this task
    schemaPaths = mutableListOf(
        "${projectDir}/src/main/resources/schema/moxie_vesting.graphqls",
    )


    // Specify the output package
    packageName = "ua.sinaver.web3.payflow.graphql.generated.moxie.vesting"

    generateClientv2 = true
    snakeCaseConstantNames = false

    // Specify type mappings
    typeMapping["Address"] = "java.lang.String"
    typeMapping["Identity"] = "java.lang.String"
    typeMapping["Map"] = "java.util.Map"
    typeMapping["Time"] = "java.util.Date"
    typeMapping["Any"] = "java.lang.String"
    typeMapping["Bytes"] = "com.google.common.primitives.Bytes"
    typeMapping["BigInt"] = "java.math.BigInteger"
    typeMapping["BigDecimal"] = "java.math.BigDecimal"
}

tasks.named("compileJava") {
    dependsOn("generateAirstackJava", "generateMoxieStatsJava", "generateMoxieVestingJava")
}

tasks.withType<BootRun> {
    if (project.hasProperty("redis")) {
        systemProperty("spring.profiles.active", "local,redis")
    } else {
        systemProperty("spring.profiles.active", "local,caffeine")
    }

    sourceResources(sourceSets["main"])
}

// gradle -d  bootBuildImage -P{profile} \                                    ✘ INT  10:54:12
// -Pgcp-image-name={artifactory}/{repository}/{image} \
// --publishImage
// TODO: permissions are not picked up for publishing - https://cloud.google.com/artifact-registry/docs/java/authentication#gcloud
tasks.named<BootBuildImage>("bootBuildImage") {
    environment.put("BP_JVM_VERSION", "21")

    if (project.hasProperty("gcp-image-name")) {
        imageName.set("${project.property("gcp-image-name")}:${project.version}")
    }
    pullPolicy.set(PullPolicy.IF_NOT_PRESENT)
    //publish.set(true)
}

tasks.register<Copy>("copyTokensJson") {
    description = "Copies tokens.json from common package to resources"
    from("../../packages/common/src/tokens/tokens.json")
    into("src/main/resources/generated")
}

// Make all relevant tasks depend on copyTokensJson
listOf("bootRun", "processResources", "bootBuildImage").forEach { taskName ->
    tasks.named(taskName) {
        dependsOn("copyTokensJson")
    }
}

tasks.test {
    useJUnitPlatform()

    testLogging {
        events("passed", "skipped", "failed", "standardOut", "standardError")
        showExceptions = true
        showCauses = true
        showStackTraces = true

        // Enable debug logging
        debug {
            events("started", "passed", "skipped", "failed", "standardOut", "standardError")
            showExceptions = true
            showCauses = true
            showStackTraces = true
            exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
        }
    }

    // Optional: Set system property for log level
    systemProperty("org.slf4j.simpleLogger.defaultLogLevel", "debug")
    systemProperty("org.slf4j.simpleLogger.log.ua.sinaver.web3.payflow.anthropic", "debug")

    // Add these JVM arguments to suppress ByteBuddy warnings
    jvmArgs(
        "-XX:+EnableDynamicAgentLoading",
        "-Djdk.instrument.traceUsage=false"
    )
}


