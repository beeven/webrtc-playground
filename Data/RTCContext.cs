using System;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace webrtc
{
    public class RTCContext: DbContext
    {
        public RTCContext(DbContextOptions<RTCContext> options): base(options)
        { }

        public DbSet<PeerDescription> Peers {get;set;}
        public DbSet<IceCandidate> IceCandidates {get;set;}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PeerDescription>()
                .Property(x => x.Id)
                .ValueGeneratedOnAdd();
            
            modelBuilder.Entity<PeerDescription>()
                .HasKey(x => x.Id);

            modelBuilder.Entity<PeerDescription>()
                .HasMany(o => o.IceCandidates)
                .WithOne()
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<IceCandidate>()
                .HasKey(x => x.Id);
            
            modelBuilder.Entity<IceCandidate>()
                .Property(x => x.Id)
                .ValueGeneratedOnAdd();

            modelBuilder.Entity<IceCandidate>()
                .HasOne(c => c.Peer)
                .WithMany( p => p.IceCandidates)
                .HasForeignKey( c => c.PeerId);
        }

    }

    public class PeerDescription
    {
        public int Id {get;set;}
        public string Type {get;set;}
        public string Name {get;set;}
        public string Sdp {get;set;}

        public List<IceCandidate> IceCandidates {get;set;}
    }


    public class IceCandidate
    {
        public int Id {get;set;}
        public string CandidateJson {get;set;}

        public int PeerId {get;set;}
        public PeerDescription Peer {get;set;}
    }
}