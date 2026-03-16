use <fonts/Pacifico.ttf>

/* [Text parameters] */
first_word = "Claire";
first_word_offset = 0;
last_word = "";
last_word_offset = 0;
words_spacing = 0;
font_size = 18;
font_name = "Pacifico:style=Regular";
text_color = "white";

/* [Base parameters] */
base_text_padding = 4;
base_height = 4;
base_color = "red";

/* [Contour/contrast parameters] */
text_contour_height = 2;
text_contour_padding = 2;
text_height = 2;
text_contour_color = "black";

/* [Chain Link] */
include_chain_link = true;
bore_size = 0;
chain_link_length = 0;

$fn = $preview ? 50 : 150;

function estimate_text_width(text, font_size) = len(text) * font_size * 0.6;

module heart_shape(size = 4) {
    scale(size / 10)
    union() {
        translate([-5, 0]) circle(r = 5);
        translate([5, 0]) circle(r = 5);
        polygon(points=[
            [-10, 0],
            [0, -12],
            [10, 0]
        ]);
    }
}

module draw_text_only() {
    spacing = words_spacing ? words_spacing : font_size / 2;
    translate([ first_word_offset, last_word ? spacing : 0 ])
        text(first_word, size = font_size, font = font_name, valign = "center");
    translate([ last_word_offset, -spacing ])
        text(last_word, size = font_size, font = font_name, valign = "center");
}

module draw_text_with_heart() {
    union() {
        draw_text_only();
        // Add heart path to be merged into the same base contour
        translate([
            first_word_offset + estimate_text_width(first_word, font_size) + font_size * 0.3,
            0
        ])
            heart_shape(size = font_size * 0.4);
    }
}

module draw_heart_contour() {
    translate([
        first_word_offset + estimate_text_width(first_word, font_size) + font_size * 0.3,
        0
    ])
        offset(r = text_contour_padding / 2)
            heart_shape(size = font_size * 0.4);
}

module draw_heart_top() {
    translate([
        first_word_offset + estimate_text_width(first_word, font_size) + font_size * 0.3,
        0
    ])
        heart_shape(size = font_size * 0.3);
}

module draw_chain_link() {
    bore_size = bore_size ? bore_size : base_text_padding * 1.5;
    chain_link_length = chain_link_length ? chain_link_length : bore_size * 2;
    translate([ 2 * bore_size - chain_link_length, 0, 0 ]) difference() {
        hull() {
            translate([ -bore_size, 0, 0 ])
                cylinder(h = base_height, r = bore_size, center = false);
            translate([ -bore_size, -bore_size, 0 ])
                cube([ chain_link_length, bore_size * 2, base_height ], false);
        }
        translate([ -bore_size, 0, 0 ])
            cylinder(h = base_height * 2, r = bore_size / 2, center = true);
    }
}

module main() {
    if (include_chain_link) {
        color(base_color) draw_chain_link();
    }

    // Base red layer (merged heart and text)
    color(base_color)
        linear_extrude(height = base_height)
            offset(r = base_text_padding)
                draw_text_with_heart();

    // Black contour layer (smaller offset of full shape)
    color(text_contour_color)
        linear_extrude(height = base_height + text_contour_height)
            union() {
                offset(r = text_contour_padding) draw_text_only();
                draw_heart_contour();
            }

    // White top text/heart layer
    color(text_color)
        linear_extrude(height = base_height + text_contour_height + text_height)
            union() {
                draw_text_only();
                draw_heart_top();
            }
}

main();
