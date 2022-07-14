from zipfile import ZipFile

with ZipFile("1file.zip", "w") as zf:
    with zf.open("test.txt", "w") as f:
        f.write(b"test")

with ZipFile("2file.zip", "w") as zf:
    with zf.open("test.txt", "w") as f:
        f.write(b"test")
    with zf.open("test2.txt", "w") as f:
        f.write(b"test2")

with ZipFile("empty1file.zip", "w") as zf:
    with zf.open("empty.txt", "w") as f:
        f.write(b"")