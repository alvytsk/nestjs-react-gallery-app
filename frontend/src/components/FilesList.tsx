import React, { useEffect, useState } from 'react';

// eslint-disable-next-line react/prop-types
const FilesList = (files) => {
  const [infos, setInfos] = useState<File[]>([]);

  useEffect(() => {
    // console.log(files);

    files && setInfos(Object.values(files));
  }, [files]);

  function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  // useEffect(() => {
  //   console.log(infos);
  // }, [infos]);

  return (
    <>
      {infos.length ? (
        <table className="files-table">
          <tbody>
            {infos.map((info) => (
              <tr key={info.name}>
                <td>{info.name}</td>
                <td>{formatBytes(info.size)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  );
};

export default FilesList;
