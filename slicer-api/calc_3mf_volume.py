import sys
import zipfile
import xml.etree.ElementTree as ET
import math

def calc():
    if len(sys.argv) < 3:
        print('{"weight_g": 0.0, "time_hours": 0.0}')
        return

    zip_path = sys.argv[1]
    infill_pct = float(sys.argv[2]) / 100.0

    total_volume = 0.0
    total_area = 0.0

    try:
        with zipfile.ZipFile(zip_path, 'r') as z:
            for zip_info in z.infolist():
                if zip_info.filename.endswith('.model'):
                    with z.open(zip_info) as f:
                        try:
                            context = ET.iterparse(f, events=('start', 'end'))
                            vertices = []
                            mesh_volume = 0.0
                            mesh_area = 0.0

                            for event, elem in context:
                                tag = elem.tag.split('}')[-1]

                                if event == 'start':
                                    if tag == 'mesh':
                                        vertices = []
                                        mesh_volume = 0.0
                                        mesh_area = 0.0
                                    elif tag == 'vertex':
                                        vertices.append((float(elem.attrib['x']), float(elem.attrib['y']), float(elem.attrib['z'])))
                                    elif tag == 'triangle':
                                        v1 = int(elem.attrib['v1'])
                                        v2 = int(elem.attrib['v2'])
                                        v3 = int(elem.attrib['v3'])
                                        p1 = vertices[v1]
                                        p2 = vertices[v2]
                                        p3 = vertices[v3]

                                        # Cross product for volume
                                        cx = p2[1]*p3[2] - p2[2]*p3[1]
                                        cy = p2[2]*p3[0] - p2[0]*p3[2]
                                        cz = p2[0]*p3[1] - p2[1]*p3[0]

                                        # Signed volume of tetrahedron
                                        vol = (p1[0]*cx + p1[1]*cy + p1[2]*cz) / 6.0
                                        mesh_volume += vol

                                        # Surface Area
                                        e1x, e1y, e1z = (p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2])
                                        e2x, e2y, e2z = (p3[0]-p1[0], p3[1]-p1[1], p3[2]-p1[2])

                                        n_x = e1y*e2z - e1z*e2y
                                        n_y = e1z*e2x - e1x*e2z
                                        n_z = e1x*e2y - e1y*e2x

                                        area = 0.5 * math.sqrt(n_x**2 + n_y**2 + n_z**2)
                                        mesh_area += area

                                elif event == 'end':
                                    if tag == 'mesh':
                                        total_volume += abs(mesh_volume)
                                        total_area += mesh_area
                                    elem.clear()
                        except Exception as e:
                            pass
    except Exception as e:
        sys.stderr.write(str(e) + "\n")

    shell_thickness = 1.2 # mm
    shell_volume = total_area * shell_thickness

    if shell_volume > total_volume:
        shell_volume = total_volume
        infill_volume = 0.0
    else:
        infill_volume = (total_volume - shell_volume) * infill_pct

    print_volume = shell_volume + infill_volume
    weight_g = print_volume * 0.00124

    # Approx 1.9 minutes per gram
    time_hours = weight_g * (1.91 / 60.0)

    import json
    print(json.dumps({
        "weight_g": round(weight_g, 2),
        "time_hours": round(time_hours, 2)
    }))

if __name__ == '__main__':
    calc()
