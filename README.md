# EvolveJS

EvolveJS is a lightweight genetics library modeled on Mendelian inheritance and Darwinian selection. When implemented into any self-replicating JavaScript object instance, the library can be used to produce descendant instances whose quantifiable variables are handled as heritable genes. Sequential replication iterations are then subject to the laws of Mendelian inheritance, gene mutation, and, when Darwinian environmental selection pressures are applied, in time, evolution.

Current stable release: https://cdn.jsdelivr.net/gh/matthewmain/EvolveJS@v1.0/evolve.js

<br>

## Quick Start Guide

This guide will walk you through getting started using EvolveJS with organism objects. Using flowering plants as an example, we'll go from creating first-generation organism objects to producing new, unique offspring objects that have inherited a combination of their parents' genes. All of the code from the examples has been implemented in _Kiss The Sky_, an indie video game based on plant evolution. For reference, check out the Kiss The Sky source code [here on GitHub](https://github.com/matthewmain/kiss_the_sky/tree/master/builds/v2.0), or have a look at a live application alongside the code [here on CodePen](https://codepen.io/matthewmain/pen/MxwBmo).

<br>

### Add EvolveJS to Your Project

First, you'll need to add the [EvolveJs library](https://cdn.jsdelivr.net/gh/matthewmain/EvolveJS@latest/evolve.js) to your project and reference the source in your html.

```
<script src="js/evolve.js"></script>
```

Or, you can reference the CDN directly.

```
<script src="https://cdn.jsdelivr.net/gh/matthewmain/EvolveJS@latest/evolve.js"></script>
```
<br>

### Create a Species Genome

A **genome** is a genetic blueprint for a generic species body. So, for our example, the first thing we'll need to do is create a genome for a plant species. EvolveJS can handle any number of distinct genomes at once, but for this guide we'll create just one. We'll use the `EV.addGenome()` method. It takes two arguments: 1) the new name you want to give the new species, and 2) the species's reproduction type. A species can have an `"asexual"`, `"sexual"`, or `"autogamous"` reproduction type. Asexual species spawn offspring with copies of just their own genes. Sexual species generate offspring by combining genes from a male/female pair. Autogamous species, like many plants, are capable both of reproducing with other organisms and self-fertilizing. We'll call our plant species a "sky plant", and because it will be a flowering plant that can both cross-pollinate and self-pollinate, we'll give it an autogamous reproduction type.

```
var skyPlantGenome = EV.addGenome( "skyPlant", "autogamous" );
```

<br>

### Add Genes to the Species Genome

Now we'll need to add some genes to the plant genome. A **gene** represents a feature (like eye color or height). It is composed of two **alleles** (each of which represents a specific trait, like brown eyes or blue eyes). If a gene's alleles are different, one will always be more dominant in relation to the other. The dominant allele's trait will be expressed in the organism, either in full or in part. The recessive allele's trait will only be expressed in part or not at all. For this step we'll use the `EV.addGene()` method, which takes the following arguments.

1. _Species genome_ (string). The name of the species genome you're adding the gene to.
2. _Gene name_ (string). The new name you'd like to give the gene.
3. _Dominance type_ (`"complete"`, `"partial"`, or `"co"`). "Complete" means only the most dominant allele's value will be expressed and the recessive allele will be ignored. "Partial" means an average of the two allele values will be expressed. "Co" means that both allele values will be expressed in different locations or in different ways, such as the colors of patchy fur. (Note that co-dominant values will be expressed in the phenotype as an array of both allele values.)
4. _Expression type_ (`"count"` or `"scale"`). Use "count" for genes whose values need to be expressed exclusively as integers (like leg count or leaf count). This will ensure that any averaged or mutated values are always returned as whole number values. Use "scale" for genes whose values can represent any point on a sliding scale (like height or speed) and can be handled as decimals.
5. _Initial value_ (number). The gene's initial value as expressed in first-generation organisms and carried by a pair of identical alleles. Initial values can be integers or decimals.
6. _Mutation frequency_ (integer). How often the gene mutates, as average reproduction events per mutation. Higher is less frequent.
7. _Mutation range_ (number). The range in which a new mutated value can occur, with the current value at the middle of the range. For example, if the allele's current value is 10 and you want new mutations to range from 8 to 12, then the mutation range should be 4. 
8. _Minimum value_ (number or `null`).  The minimum value that any trait can have. Mutated allele values cannot fall below it. An argument of `null` allows values to mutate to increasingly lower values without limit. 
9. _Maximum value_ (number or `null`). The maximum value that any trait can have. Mutated allele values cannot rise above it. An argument of `null` allows values to mutate to increasingly higher values without limit. 
 EvolveJS allows you to add an unlimited number of genes to a genome and create an extremely complex organism. Here, we'll include just a few basic plant characteristics as example genes.

``` 
EV.addGene( skyPlantGenome, "stalkStrength", "partial", "scale", 0.75, 5, 0.1, 0.7, 0.8 );
EV.addGene( skyPlantGenome, "maxLeafLength", "partial", "scale", 5.5, 5, 3, 4, null );
EV.addGene( skyPlantGenome, "flowerHue", "complete", "count", 130, 5, 50, 0, 260 ); 
```

<br>

### Include an Organism Object Constructor With Genotype and Phenotype Values

A **genotype** is a genetic blueprint for a specific organism's body. It is composed of all of that organism's genes, each of which includes specific allele pairs. The organisms that will compose our first generation of plants will need to be assigned their own genotypes. (All of the organisms in later generations will automatically inherit a combination of their parents' genes as their own new genotypes.) EvolveJS offers a couple of options for generating new first-generation genotypes. You can use `EV.newStandardFirstGenGenotype()` to create any number of identical first-generation organisms, or you can use `EV.newRandomizedFirstGenGenotype()` to create a variety of unique organisms whose genes are slightly different. Both take one argument, a species genome. We want to start with a diverse population of sky plants, so we'll use randomized sky plant genotypes.

A **phenotype** represents the organism's physical body. It is composed of all of the organism's expressed traits, each of which is determined by the rules of dominant and recessive gene expression. EvolveJS will automatically generate an organism's phenotype with `EV.generatePhenotype()`. It takes one argument, the organism's genotype. 

Evolve.js can be applied to any Javascript object constructor that represents an organism. For our example, let's use a simple Plant object constructor. We'll give it a genotype parameter so that later generations' new genotypes can be passed into the constructor. We'll also give it a genotype variable, a phenotype variable, and gene variables for each of the genes we created above. The gene variables need to be assigned their phenotype value, which is indexed in the phenotype object as the gene's name with an appended "Value" substring. For example, the "stalkStrength" variable should be assigned as `phenotype.stalkStrengthValue`.

```
function Plant( genotype ) {
    this.genotype = genotype;
    this.phenotype = EV.generatePhenotype( this.genotype ); 
    this.stalkStrength = this.phenotype.stalkStrengthValue;
    this.maxLeafLength = this.phenotype.maxLeafLengthValue;
    this.flowerHue = this.phenotype.flowerHueValue;
}
```

From here, we can create any number of sky plant organism objects. Let's create twenty new sky plants with unique genotypes and store them in an array as an initial population.

```
var skyPlants = [];
for ( var i=0; i<20; i++ ) {
    var newSkyPlantGenotype = EV.newRandomizedFirstGenGenotype( skyPlantGenome );
    skyPlants.push( new Plant( newSkyPlantGenotype ) );
}
```

<br>

### Generate New Organism Objects with Inherited Traits and Random Mutations

Now that we have an initial population of sky plants outfitted with EvolveJS, each plant is now equipped to reproduce and generate new offspring. Whenever your program is ready for organism reproduction, from here all we need is the `EV.meiosos()` method to generate new offspring organisms. It takes three arguments, 1) the species genome, 2) the first parent organism's genotype, and 3) the second parent organism's genotype (optional for autogamous species, and should be omitted for asexual species). Because sky plants are autogamous, whenever they self-pollinate we can either include just one parent genotype, or include the same parent genotype twice as the first and second parent genotype. Whenever they cross-pollinate, we'll need to include both parent genotypes.

(Note that for sexually reproducing species, you will need to provide one male and one female genotype. An organism's sex is stored under the `<species genome name>.phenotype.sex` namespace. Sexually reproducing sexes are randomly either "male" or "female", asexual species's sex is always "none", and autogamous species's sex is always "hermaphrodite.")

For our example, we'll create a new offspring sky plant genotype with two parents who have cross-pollinated. We'll then pass into the skyPlant organism constructor add the new sky plant to the population array.

```
var childSkyPlantGenotype = EV.meiosis( skyPlantGenome, skyPlants[0].genotype, skyPlants[1].genotype );
skyPlants.push( new skyPlant( childSkyPlantGenotype ) );
```

Every time your program reproduces organisms using meiosis events, each new offspring object will automatically have a genotype constructed from its parent or parents' genotyped and a resulting phenotype based on the laws of Mendelian genetics. Some genes will mutate during reproduction, and the offspring carrying these genes will slightly alter the species genome. If Darwinian selection pressures are applied and the species reproduces for many generations, the species genome will gradually evolve.


## Library Index

`EV.species`
A collection of all species genomes, by species name. 

`EV.Allele`
A trait (e.g., brown eyes). One of two sub-component pairs of a gene. 

<br>
<br>
<br>

© Matthew Main 2019
