require 'rake'

task :all => [:runners, :webworkers] do
end

task :runners do
	inclusions = "--include header --include runners --include footer"
	build(inclusions, "../dist/Runners")
end

task :webworkers do
	inclusions = "--include header --include webworkers"
	build(inclusions, "../dist/webworkers/runnerWebWorker")
end

def build(inclusions, out)
	Dir.chdir("./build") do
		system "node build.js #{inclusions} --output #{out}.js"
		system "node build.js #{inclusions} --minify --output #{out}.min.js"
	end
end