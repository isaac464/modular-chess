# modular-chess
A modular, vanilla JS chess engine built for extensibility. Featuring a polished UI and custom strategy arrows, designed as a playground for unorthodox rules and experimental game modes.

Project Status: Work in Progress (WIP)
This engine is currently in active development. While the core game is functional, the modular framework is being built out to allow for seamless rule-set toggling and the introduction of unique game modes.

Features
-Professional UI: A clean interface inspired by modern chess platforms.
-External Coordinates: Algebraic notation (ranks 1-8 and files a-h) positioned outside the board for maximum clarity.
-Dynamic SVG Arrows: Support for drawing strategy arrows with a right-click, including specialised 90-degree L-shapes for knight movements.
-Core Chess Rules: Full implementation of standard mechanics, including:
-Castling (kingside and queenside).
-En passant.
-Pawn promotion with a dedicated UI overlay.
-Lightweight Architecture: Zero dependencies. Developed using pure JavaScript, css and PHP/HTML without the need for external frameworks or libraries.

Launch the game:
Open index.html in any modern web browser, you currently have to load this up localy through apache (other things not tested), but in the future i am thinking of making this a website.

Roadmap
Future updates will introduce the ability to toggle specific variants and game modes, such as:
-Variant Support: Atomic Chess, Fog of War, and Horde Mode.
-Custom Boards: Support for non-standard grid sizes.
-Fairy Pieces: Introduction of pieces with unique, non-traditional movement patterns.
-Theming Engine: Swappable colour schemes and piece sets.

Development Log
Semi-detailed progress and architectural changes are tracked in the development logs located in the documentation folder.

Licence
This project is open-source and available under the MIT Licence.
