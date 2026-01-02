package com.flaton.ai.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Upgrade
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.flaton.ai.ui.screens.VideoUpscaleScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    var selectedItem by remember { mutableIntStateOf(0) }
    val items = listOf("Trang chủ", "Nâng cấp Video")
    val icons = listOf(Icons.Default.Home, Icons.Default.Upgrade)

    Scaffold(
        bottomBar = {
            NavigationBar {
                items.forEachIndexed { index, item ->
                    NavigationBarItem(
                        icon = { Icon(icons[index], contentDescription = item) },
                        label = { Text(item) },
                        selected = selectedItem == index,
                        onClick = { selectedItem = index }
                    )
                }
            }
        }
    ) { innerPadding ->
        Surface(modifier = Modifier.padding(innerPadding)) {
            when (selectedItem) {
                0 -> WelcomeContent()
                1 -> VideoUpscaleScreen()
            }
        }
    }
}

@Composable
fun WelcomeContent() {
    androidx.compose.foundation.layout.Column(
        modifier = androidx.compose.foundation.layout.Modifier.fillMaxSize(),
        verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center,
        horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally
    ) {
        Text("Chào mừng bạn đến với Flaton AI", style = MaterialTheme.typography.headlineMedium)
        Text("Chọn một tính năng bên dưới để bắt đầu", style = MaterialTheme.typography.bodyLarge)
    }
}
