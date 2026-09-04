package com.nulljosh.cadence

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class Project(
    val name: String,
    val commits30: Int,
    val lastCommitAgo: String,
    val status: String,
)

@Serializable
data class Stats(
    val total30: Int,
    val activeProjects: Int,
    val bestDay: Int,
    val streak: Int,
)

// Reads the same public endpoints the web dashboard does. No GITHUB_TOKEN
// here on purpose -- that stays server-side in the Worker; a native client
// embedding it would leak it.
class CadenceClient(private val baseUrl: String = "https://cadence.heyitsmejosh.com") {
    private val http = HttpClient {
        install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) }
    }

    suspend fun projects(): List<Project> = http.get("$baseUrl/api/projects").body()
    suspend fun stats(): Stats = http.get("$baseUrl/api/stats").body()
}
