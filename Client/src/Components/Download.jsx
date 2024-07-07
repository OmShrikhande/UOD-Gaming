// ImageDownloader.js
import React from 'react';
import '../Css/Download.css'
import Foote from './Foote';

const Downloader = () => {
  const images = [
    { src: 'https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU', alt: 'Image 1' },
    { src: 'https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU', alt: 'Image 2' },
    { src: 'https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU', alt: 'Image 3' },

    { src: 'https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU', alt: 'Image 1' },
    { src: 'https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU', alt: 'Image 2' },
    { src: 'https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU', alt: 'Image 3' },

    { src: 'https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU', alt: 'Image 1' },
    { src: 'https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU', alt: 'Image 2' },
    { src: 'https://play-lh.googleusercontent.com/zPxLgj5nvl20ahJV7aFC6S5mD8kii5CEEDj25j1P9CYAfXL9sdDuO-8eES0r4DhJHrU', alt: 'Image 3' },
    // Add more images to the array as needed
  ];
  const handleImageClick = (imageSrc) => {
    fetch(imageSrc)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `image_${Date.now()}.jpg`;
        a.click();
      });
  };
  return (
    <div>
        <h1>Get Some File Downloaded</h1>
    <div className="image-grid">
      {images.map((image, index) => (
        <img
          key={index}
          src={image.src}
          alt={image.alt}
          onClick={() => handleImageClick(image.src)}
          className="image"
        />
      ))}
    </div>
    <Foote/>
    </div>
   
  );
};

//alternative for local Download
// const handleImageClick = (imageSrc) => {
//     const img = new Image();
//     img.crossOrigin = 'anonymous'; // Add this line
//     img.src = imageSrc;
//     img.onload = () => {
//       const canvas = document.createElement('canvas');
//       canvas.width = img.width;
//       canvas.height = img.height;
//       const ctx = canvas.getContext('2d');
//       ctx.drawImage(img, 0, 0);
//       const url = canvas.toDataURL('image/jpeg');
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `image_${Date.now()}.jpg`;
//       a.click();
//     };
//   };


// for the backend check this one time

// import React from 'react';
// import axios from 'axios'; // Add axios for making HTTP requests

// const Downloader = () => {
//   const images = [
//     { src: 'https://example.com/image1.jpg', alt: 'Image 1' },
//     { src: 'https://example.com/image2.pdf', alt: 'Image 2' },
//     { src: 'https://example.com/image3.zip', alt: 'Image 3' },
//     // Add more files to the array as needed
//   ];

//   const handleFileDownload = (fileUrl) => {
//     axios({
//       method: 'get',
//       url: fileUrl,
//       responseType: 'blob'
//     })
//     .then(response => {
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', fileUrl.split('/').pop()); // Set the download filename
//       link.click();
//     })
//     .catch(error => console.error(error));
//   };

//   return (
//     <div className="image-grid">
//       {images.map((image, index) => (
//         <img
//           key={index}
//           src={image.src}
//           alt={image.alt}
//           onClick={() => handleFileDownload(image.src)}
//           className="image"
//         />
//       ))}
//     </div>
//   );
// };

// export default Downloader; 
export default Downloader;