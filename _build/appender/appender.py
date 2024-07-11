import os # file system manipulation (OS-dependent)
import re # regular expressions

# try to create the output directory, in case it isn't already there

try:
    os.mkdir("appender_out")
except:
    pass

# grab all of the .txt files in the current directory. these represent the files
# we are going to be creating, and their content tells us what files should be
# added to them.

files = os.listdir('.');
txtFiles = []

for f in files:

    m = re.match(r'^(.+).txt$',f)
    if m is not None:
        txtFiles.append(m.group(1))

# go through our list of files to create, one by one. we do this in stages:
# (1) read in each line of the .txt file that tells us what files to append
# (2) create the file in question
# (3) read each file we're supposed to
# (4) append it to the file we've created

for outputFilename in txtFiles:

    # (1)

    i = open(outputFilename + ".txt","r")
    inputFiles = i.readlines()
    i.close()

    # (2)

    print("- Creating: %s" % outputFilename)
    o = open("appender_out\\" + outputFilename,"w")

    # (3)

    for iname in inputFiles:

        iname = iname.strip()        
        try:
            i = open(iname,"r")
        except:
            continue
        print("Appending: %s " % iname)
        c = i.read()
        i.close()

        # (4)

        o.write(c)
        o.write('\n\n')

    o.close()

    print("\nDone.")

# all done.

input("Press enter to exit...")
