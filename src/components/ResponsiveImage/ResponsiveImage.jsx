import Image from "next/image";

const ResponsiveImage = ({ src, alt, ...rest }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={0}
      height={0}
      sizes="100%"
      {...rest}
    />
  );
};

export default ResponsiveImage;
