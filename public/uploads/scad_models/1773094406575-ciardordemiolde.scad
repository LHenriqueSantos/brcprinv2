$fn = 20;

//😄 > emojihub.org <
emoji = "🦈🐙🐋🐚🦑"; 
emojiSize = 50;
height = 15;

// Emoji size for border
emojiSize_border = emojiSize / 1.2;

// Border module
module border() {
    translate([0, 0, 0]) {
        difference() {
            linear_extrude(height) {
                fill() {
                    offset(3) {
                        text(emoji, size = emojiSize, font = "Noto Emoji", halign = "center", valign = "center");
                    }
                }
            };
            linear_extrude(height) {
                fill() {
                    offset(1) {
                        text(emoji, size = emojiSize, font = "Noto Emoji", halign = "center", valign = "center");
                    }
                }
            };
            
        }
    }
}




// Engraving module
module emoji_engraving() {
    difference() {
        // Base plate
        linear_extrude(5) {
                fill() {
                    offset(1) {
                        text(emoji, size = emojiSize, font = "Noto Emoji", halign = "center", valign = "center");
                    }
                }
        }
        
        // Engraved emoji
        translate([0, 0, 2]) {
            linear_extrude(4) {
                text(emoji, size = emojiSize, font = "Noto Emoji", halign = "center", valign = "center");
            }
        }
    }
}

// Call the modules
emoji_engraving();
border(); // Call the first border
