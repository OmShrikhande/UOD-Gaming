// ImageDownloader.js
import React from 'react';
import '../Css/Download.css'
import Foote from './Foote';

const Downloader = () => {
  const images = [
    { src: 'https://qph.cf2.quoracdn.net/main-qimg-e26d8b7c07bda45bc6c3ebb4ae522946.webp', alt: 'Image 1' },
    { src: 'https://store-images.s-microsoft.com/image/apps.23625.13806078025361171.9723cf5e-1e29-4d9d-ad0a-cc37a95bb75d.e02f4ead-d89b-45cd-8eb5-5dcbf44ae91f?q=90&w=256&h=384&mode=crop&format=jpg&background=%23FFFFFF', alt: 'Image 2' },
    { src: 'https://static.javatpoint.com/top10-technologies/images/top-10-car-racing-games-for-pc-free-download1.jpg', alt: 'Image 3' },

    { src: 'https://hips.hearstapps.com/vader-prod.s3.amazonaws.com/1686588690-71tSb7u1q9L.jpg?crop=1.00xw:0.710xh;0,0.114xh&resize=980:*', alt: 'Image 1' },
    { src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7_5HL-0WePb6JhTa8fd168e1gcK_xnQpD_g&s', alt: 'Image 2' },
    { src: 'https://i.ytimg.com/vi/3zwBKlwgpk4/maxresdefault.jpg', alt: 'Image 3' },

    { src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiAj6EuyWmiefK4ewl14s0VMFeJ7B-GZJjlbM9F4pOiTrnvptWwkoro_IOPuB-TnPzMUM&usqp=CAU', alt: 'Image 1' },
    { src: 'https://www.fullgamepc.com/wp-content/uploads/2020/01/Ready-or-Not-game-download-348x139.jpg', alt: 'Image 2' },
    { src: 'https://products.eneba.games/resized-products/q8shkfzxblrn22o9dvra_350x200_3x-0.jpg', alt: 'Image 3' },
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