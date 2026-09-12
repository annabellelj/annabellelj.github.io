# Hero greeting film

`annabelle-hello.mp4` preserves the supplied green-screen greeting. The homepage uses `annabelle-hello-silent.mp4`, copied without any audio stream (`-map 0:v:0 -an -c:v copy`).

`hero-film.js` keys the green backdrop into transparent, premultiplied WebGL output and suppresses green spill. The greeting plays once per page load and retains its final frame. There are no playback or sound controls. Offscreen/background playback pauses internally and resumes the unfinished clip. Reduced-motion visitors see a still; decoding or WebGL failures leave the static character visible.

The source zooms from full body to a closer framing and does not contain feet in its last frames. A narrow transparent lower-edge feather softens that crop; it does not reconstruct missing body parts.
