<?php
    require_once $_SERVER['DOCUMENT_ROOT'] . "/lib.php";
    exit(Security::loginURL(["test" => 1,"val" => 2]));
?>
<html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - LFNY</title>
        <link href="/lib.css" rel="stylesheet" type="text/css">
        <style>
            .dark-theme {
	--primary-color: #212529;
	--primary-color-hover: #1b1f22;
	--primary-color-click: #000000;
	--secondary-color: #495057;
  --secondary-color-hover: #3c434a;
	--tertiary-color: #868e96;
	--accent-color: #228be6;
	--accent-color-hover: #1971c2;
	--accent-color-click: #10599e;
	--primary-text-color: #f8f9fa;
	--secondary-text-color: #dee2e6;
	--blue: #8C9EFF;
	--green: #B9F6CA;
	--red: #F44336;
	--yellow-1: #FF8F00;
	--yellow-2: #FFD740;
	--yellow-3: #FFE57F;
	--purple: #B388FF;
	--pink: #FF80AB;
	--cyan: #84FFFF;

	accent-color: var(--accent-color);
}
            body {
                background: var(--primary-color);
                color: var(--primary-text-color);
            }
          section {
            background: var(--secondary-color);
            color: white;
            border-radius: 1em;
            padding: 30px;
            position: absolute;
            top: 50%;
            left: 50%;
            margin-right: -50%;
            transform: translate(-50%, -50%);
            max-width: 100%;
						animation: fade-in 1s;
						opacity: 1;
          }

					@keyframes fade-in {
						from { opacity: 0; }	
						to { opacity: 1; }
					}
					
          img {
            max-width: 100%;
          }
          section p {
            text-align: center;
						margin-top: 10px;
          }

          a {
            border: none;
            width: 220px;
            max-width: 100%;
            height: 50px;
            border-radius: 10px;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
            margin-right: auto;
            background: var(--accent-color);
            cursor: pointer;
            color: var(--light-text-color);
            transition: var(--transition-buttons);
            font-family: 'Be Vietnam Pro', sans-serif;
            letter-spacing: 2px;
            margin-top: 20px;
          }

					a:hover {
						background: var(--accent-color-hover);
						color: var(--light-text-color);
						text-decoration: none;
						transform: scale(1.05);
					}

					a:active {
						background: var(--accent-color-click);
						transform: scale(0.95);
					}

          ion-icon {
            font-size: 20px;
            --ionicon-stroke-width: 60px;
          }

          #arr {
            font-size: 27px;
          }
        </style>
      </head>

      <body class="dark-theme">
        <section>
          <img class="logo" src="/lycee.png">
          <p>Please login to continue</p>
          <a href="/login.php?action=login"><ion-icon name="logo-google" style="margin-right: 10px;"></ion-icon>Login<!--<ion-icon name="arrow-forward-circle-outline" style="margin-left: 10px;" id="arr"></ion-icon>--></a>
        </section>
        <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
        <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
      </body>
    </html>