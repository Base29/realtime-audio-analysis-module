cmake_minimum_required(VERSION 3.18.0)

project(realtimeaudioanalyzer)

# Add KissFFT files
# We will download/copy kiss_fft simple source or expect it in src/main/cpp/kiss_fft
# For this implementation, we will bundle the simplified kiss_fft.c and kiss_fft.h

set(KISS_FFT_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp/kiss_fft)

file(GLOB KISS_FFT_SOURCES
    "${KISS_FFT_DIR}/kiss_fft.c"
    "${KISS_FFT_DIR}/kiss_fftr.c"
)

# JNI Wrapper
file(GLOB JNI_SOURCES
    "${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp/audio-analysis-jni.cpp"
)

add_library(realtimeaudioanalyzer SHARED
    ${JNI_SOURCES}
    ${KISS_FFT_SOURCES}
)

target_include_directories(realtimeaudioanalyzer PRIVATE
    ${KISS_FFT_DIR}
)

find_library(log-lib log)

target_link_libraries(realtimeaudioanalyzer
    ${log-lib}
)
