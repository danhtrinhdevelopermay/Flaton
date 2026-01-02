package com.flaton.ai.api

import com.google.gson.annotations.SerializedName
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonFactory
import retrofit2.http.*

data class GenerateResponse(
    @SerializedName("taskId") val taskId: String,
    @SerializedName("taskType") val taskType: String
)

interface FlatonApiService {
    @POST("api/generate/nano-banana")
    suspend fun generateImage(@Body request: Map<String, String>): GenerateResponse

    @POST("api/generate/topaz-video")
    suspend fun upscaleVideo(@Body request: Map<String, String>): GenerateResponse
}

object ApiClient {
    private const val BASE_URL = "https://flaton-ai.replit.app/" // Thay bằng URL thực tế

    val service: FlatonApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(FlatonApiService::class.java)
    }
}
