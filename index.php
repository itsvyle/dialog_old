<?php
	// TEST
	require_once "lib.php";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>!</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- <base href="file:///C:/VBData 2019/Dialog/Dialog"> -->
    <!-- Lib: import first -->
    <script src="/lib.js" type="application/javascript"></script>
    <link href="/lib.css" rel="stylesheet">
    <link rel="preload" as="image" href="/lycee.png">
</head>
<body>
    <div class="nav-container">
        <div class="flex-container">
            <div class="nav-menu-button nav-hoverable nav-verti" onclick="document.getElementsByClassName('nav-container')[0].classList.toggle('open');">
                <ion-icon name="menu-outline"></ion-icon>
            </div>
            <div class="nav-item nav-logo-container">
                <a href="/index.php"><img class="nav-logo" src="/lycee.png"></a>
            </div>
            <div class="nav-verti-completer nav-verti nav-hoverable" onclick="openProfileDropdown(this,event);">
                <!--<image class="nav-verti-profile-image" src="https://lh3.googleusercontent.com/ogw/ADea4I7EcwTiS1J74sKsAHKYYKrbWB3HXhEzqTEqDWGI=s32-c-mo">-->
                <ion-icon name="person-circle-outline" class="nav-verti-profile-image"></ion-icon>
                <ion-icon name="chevron-down-outline"></ion-icon>
            </div>
        </div>
        <div class="nav-item nav-item-full">
            <a class="nav-link nav-item" href="/index.php">Home</a>
            <a class="nav-link nav-item" href="/index.php">Calendar</a>
            <a class="nav-link nav-item" href="/index.php">Teachers</a>
            <a class="nav-link nav-item nav-verti" href="/index.php"><ion-icon name="add-outline" class="nav-verti-signup-icon"></ion-icon>Sign up</a>
        </div>
        <a class="nav-item nav-add-button-container nav-hoverable nav-hori" href="about:blank">
            <div>
                <ion-icon name="add-outline" class="nav-add-button"></ion-icon>
            </div>
            <span>Sign up</span>
        </a>
        <div class="nav-item nav-profile-container nav-hoverable nav-hori" onclick="openProfileDropdown(this,event);">

            <!--<image class="nav-profile-image" src="https://lh3.googleusercontent.com/ogw/ADea4I7EcwTiS1J74sKsAHKYYKrbWB3HXhEzqTEqDWGI=s32-c-mo">-->
            <ion-icon name="person-circle-outline" class="nav-profile-image"></ion-icon>
            <p class="nav-profile-name">Gregorius</p>
            <ion-icon name="chevron-down-outline"></ion-icon>
        </div>
    </div>
    <div class="nav-profile-dropdown" id="nav-profile-dropdown">
        <a class="nav-profile-dropdown-item"><ion-icon name="settings-outline"></ion-icon>Settings</a>
        <a class="nav-profile-dropdown-item"><ion-icon name="log-out-outline"></ion-icon>Logout</a>
    </div>


    <!-- Ion-Icons importation -->
    <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
</body>
</html>
