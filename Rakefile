require 'rake'

task :all => [:runners, :pworkers] do
	Dir.chdir("./build") do
		system "node build.js"
		system "node build.js --minify --output ../dist/Runners.min.js"
	end
end

task :runners do
end

task :pworkers do
end