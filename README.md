<h1 align="center">
  <img src="https://github.com/Eneru2/pixel-morph/blob/main/pixel_morph_logo.png" alt="Pixel Morph">
</h1>

Pixel Morph is an image converter created with Electron that allows you to convert any kind of BASE64 image to png, jpeg and webp.<br> 
Some of its features are:

- Bulk conversion
- Drag-and-drop files
- Beautiful design

<img src="https://fiverr-res.cloudinary.com/images/q_auto,f_auto/gigs/323177892/original/3847d47013299cce4970a6c881067a248f008ba4/create-a-cross-platform-desktop-application-for-you.png">

Install from package
-------------------
Pre-built packages for Windows, macOS, and Linux are found on the
[Releases](https://github.com/Eneru2/pixel-morph/releases/) page.

Install from source
-------------------
You need to clone the repository:
  ```
  git clone https://github.com/Eneru2/pixel-morph
  ```
You will need [npm](https://nodejs.org/en/download) in case you don't have it. 
Then run the following commands after cloning:
  ```
  cd pixel-morph
  npm install
  npm run make
  ```
After that you will have the executable file corresponding to your OS and architecture.

Future of the project
--------------------
Right now I'm transitioning the project from Electron to [Tauri](https://tauri.app/) an alternative that is way lighter and is coded in Rust which will result in a more performant program. After I'm done with that I'd like to introduce some new features to make the program more appealing.
