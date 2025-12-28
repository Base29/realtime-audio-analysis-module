cmake_minimum_required(VERSION 3.18.0)
project(realtimeaudioanalyzer)

# CMake is invoked with -S <module>/android, so use module-root relative paths:
set(CPP_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp)
set(KISS_FFT_DIR ${CPP_DIR}/kiss_fft)

set(KISS_FFT_SOURCES
    ${KISS_FFT_DIR}/kiss_fft.c
    ${KISS_FFT_DIR}/kiss_fftr.c
)

set(JNI_SOURCES
    ${CPP_DIR}/audio-analysis-jni.cpp
)

add_library(realtimeaudioanalyzer SHARED
    ${JNI_SOURCES}
    ${KISS_FFT_SOURCES}
)

target_include_directories(realtimeaudioanalyzer PRIVATE
    ${CPP_DIR}
    ${KISS_FFT_DIR}
)

find_library(log-lib log)

target_link_libraries(realtimeaudioanalyzer
    ${log-lib}
)

# Needed for KissFFT static build on Android
target_compile_definitions(realtimeaudioanalyzer PRIVATE KISS_FFT_STATIC)