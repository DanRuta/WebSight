#include <stdint.h>
#include <math.h>
#include <vector>

// int SOBEL_LENGTH = 3;
int SOBEL_FILTER_X[3][3] = {{-1, 0, 1}, {-2, 0, 2}, {-1, 0, 1}};
int SOBEL_FILTER_Y[3][3] = {{1, 2, 1}, {0, 0, 0}, {-1, -2, -1}};

int height;
int width;

std::vector<std::vector<int> > buildMatrix (int cx, int cy) {
    std::vector<std::vector<int> > matrix;

    int nx = 0;
    int ny = 0;

    for (int i=0, y=-1; i<3; i++, y++) {
        std::vector<int> m_1;

        for (int j=0, x=-1; j<3; j++, x++) {

            nx = cx + x;
            ny = cy + y;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                m_1.push_back(0);
            } else {
                m_1.push_back((ny * width + nx) * 4);

            }
        }

        matrix.push_back(m_1);
    }

    return matrix;
}

bool isBorder (int x, int y) {
    return ((x == 0 && y < height && y >= 0) ||
            (y == 0 && x < width && x >= 0) ||
            (x == width - 1 && y < height && y >= 0) ||
            (y == height - 1 && x < width && x >= 0));
}

uint8_t* convolve (uint8_t *buf, int bufSize) {

    int cvsIndex;
    int pixelIndex;
    std::vector<std::vector<int> > matrix;
    uint8_t out[bufSize/4];

    for (int y=0; y<height; y++) {
        for (int x=0; x<width; x++) {

            pixelIndex = y * width + x;
            cvsIndex = x * 4 + y * width * 4;
            matrix = buildMatrix(x, y);

            int edgeX = 0;
            int edgeY = 0;

            if (!isBorder(x, y)) {
                for (int i=0; i<3; i++) {
                    for (int j=0; j<3; j++) {

                        if (matrix[i][j]) {
                            edgeX += buf[matrix[i][j]] * SOBEL_FILTER_X[i][j];
                            edgeY += buf[matrix[i][j]] * SOBEL_FILTER_Y[i][j];
                        }
                    }
                }
            }

            int grad = round( sqrt(edgeX*edgeX + edgeY*edgeY) );
            int i = (x + y * width);


            if (i < bufSize) {
                out[i] = grad;
            }
        }
    }

    auto arrayPtr = &out[0];
    return arrayPtr;
}