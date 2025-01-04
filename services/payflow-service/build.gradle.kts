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
    mainClass.set("ua.sinaver.web3.payflow.PayflowApplication")
}

group = "ua.sinaver.web3.payflow"
version = "0.0.13"

java.sourceCompatibility = JavaVersion.VERSION_21

repositories {
    mavenCentral()
}

if (project.hasProperty("gcp")) {
    extra["springCloudGcpVersion"] = "5.9.0"
    extra["springCloudVersion"] = "2024.0.0"
}

extra["flywayVersion"] = "11.1.0"

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

    implementation("io.hypersistence:hypersistence-utils-hibernate-63:3.9.0")
    implementation("io.jsonwebtoken:jjwt:0.12.6")

    if (project.hasProperty("gcp")) {
        project.logger.info("Including GCP dependencies")
        // gcp
        implementation("com.google.cloud:spring-cloud-gcp-starter")
        implementation("com.google.cloud:spring-cloud-gcp-starter-sql-mysql")
        implementation("com.google.cloud:google-cloud-redis")
    } else {
        // local
        //runtimeOnly ("com.h2database:h2")
        runtimeOnly("com.mysql:mysql-connector-j:9.1.0")
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
    implementation("org.apache.commons:commons-lang3:3.17.0")
    implementation("com.google.guava:guava:33.4.0-jre")
    implementation("com.google.code.gson:gson:2.11.0")

    // java.lang.NoSuchMethodError: 'reactor.core.publisher.Mono reactor.core.publisher.Mono.onErrorComplete()'
    implementation("io.projectreactor:reactor-core:3.7.1")

    runtimeOnly("io.netty:netty-resolver-dns-native-macos:4.1.116.Final:osx-aarch_64")

    // crypto
    implementation("org.bouncycastle:bcprov-jdk18on:1.79")
    implementation("org.web3j:core:4.12.3")
    implementation("org.web3j:contracts:4.12.3")
    //siwe
    implementation("com.moonstoneid:siwe-java:1.0.7")

    //lombok
    compileOnly("org.projectlombok:lombok:1.18.36")

    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // Exclude slf4j-simple from all dependencies
    configurations.all {
        exclude(group = "org.slf4j", module = "slf4j-simple")
    }

    // Add these lines
    implementation("net.javacrumbs.shedlock:shedlock-spring:6.0.2")
    implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc-template:6.0.2")
}


dependencyManagement {
    imports {
        mavenBom("com.netflix.graphql.dgs:graphql-dgs-platform-dependencies:latest.release")

        if (project.hasProperty("gcp")) {
            // gcp
            mavenBom("com.google.cloud:spring-cloud-gcp-dependencies:${property("springCloudGcpVersion")}")
            mavenBom("org.springframework.cloud:spring-cloud-dependencies:${property("springCloudVersion")}")
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
