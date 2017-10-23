#include <emscripten.h>
#include "sobel.cpp"

int main(int argc, char const *argv[]) {
    emscripten_run_script("window.dispatchEvent(new CustomEvent('wasmLoaded'))");
    return 0;
}

extern "C" {

    EMSCRIPTEN_KEEPALIVE
    uint8_t* _convolve (uint8_t *buf, int bufSize) {
        return convolve(buf, bufSize);
    }

    EMSCRIPTEN_KEEPALIVE
    void setSize (int h, int w) {
        height = h;
        width = w;
    }
}