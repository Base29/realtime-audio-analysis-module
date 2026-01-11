package com.realtimeaudio

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class AudioAnalyzerDemoActivity : AppCompatActivity() {
    
    private lateinit var statusText: TextView
    private lateinit var sampleRateText: TextView
    private lateinit var rmsText: TextView
    private lateinit var peakText: TextView
    private lateinit var levelProgressBar: ProgressBar
    private lateinit var startStopButton: Button
    private lateinit var resetButton: Button
    
    private var audioEngine: AudioEngine? = null
    private var isRecording = false
    
    companion object {
        private const val PERMISSION_REQUEST_CODE = 1001
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(createLayout())
        
        initializeViews()
        setupAudioEngine()
        checkPermissions()
    }
    
    private fun createLayout(): Int {
        // For simplicity, we'll create the layout programmatically
        // In a real app, you'd use XML layouts
        return android.R.layout.activity_list_item
    }
    
    private fun initializeViews() {
        // Create views programmatically for this demo
        statusText = TextView(this).apply {
            text = "Status: Stopped"
            textSize = 18f
        }
        
        sampleRateText = TextView(this).apply {
            text = "Sample Rate: 48000 Hz"
            textSize = 16f
        }
        
        rmsText = TextView(this).apply {
            text = "RMS: 0.000"
            textSize = 16f
        }
        
        peakText = TextView(this).apply {
            text = "Peak: 0.000"
            textSize = 16f
        }
        
        levelProgressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progress = 0
        }
        
        startStopButton = Button(this).apply {
            text = "Start"
            setOnClickListener { toggleRecording() }
        }
        
        resetButton = Button(this).apply {
            text = "Reset"
            setOnClickListener { reset() }
        }
        
        // Simple vertical layout
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
        }
        
        layout.addView(TextView(this).apply {
            text = "Audio Analyzer Demo"
            textSize = 24f
            setPadding(0, 0, 0, 32)
        })
        
        layout.addView(statusText)
        layout.addView(sampleRateText)
        layout.addView(rmsText)
        layout.addView(peakText)
        layout.addView(levelProgressBar)
        
        val buttonLayout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
        }
        buttonLayout.addView(startStopButton)
        buttonLayout.addView(resetButton)
        layout.addView(buttonLayout)
        
        setContentView(layout)
    }
    
    private fun setupAudioEngine() {
        audioEngine = AudioEngine { data ->
            runOnUiThread {
                updateAudioData(data)
            }
        }
    }
    
    private fun updateAudioData(data: AudioEngine.AudioData) {
        sampleRateText.text = "Sample Rate: ${data.sampleRate} Hz"
        rmsText.text = "RMS: ${String.format("%.3f", data.rms)}"
        peakText.text = "Peak: ${String.format("%.3f", data.peak)}"
        
        // Update progress bar (0-100 scale)
        val rmsPercent = (data.rms * 100).toInt().coerceIn(0, 100)
        levelProgressBar.progress = rmsPercent
    }
    
    private fun checkPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) 
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                PERMISSION_REQUEST_CODE
            )
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Microphone permission granted", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Microphone permission required", Toast.LENGTH_LONG).show()
            }
        }
    }
    
    private fun toggleRecording() {
        if (isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }
    
    private fun startRecording() {
        try {
            audioEngine?.start(
                bufferSize = 1024,
                sampleRate = 48000,
                callbackRateHz = 30,
                emitFft = false
            )
            
            isRecording = true
            statusText.text = "Status: 🎤 Recording"
            startStopButton.text = "Stop"
            
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to start: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
    
    private fun stopRecording() {
        audioEngine?.stop()
        
        isRecording = false
        statusText.text = "Status: ⏹ Stopped"
        startStopButton.text = "Start"
    }
    
    private fun reset() {
        stopRecording()
        rmsText.text = "RMS: 0.000"
        peakText.text = "Peak: 0.000"
        levelProgressBar.progress = 0
    }
    
    override fun onDestroy() {
        super.onDestroy()
        audioEngine?.stop()
    }
}